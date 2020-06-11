import React, { useState, useMemo, useEffect } from 'react';
import { Loader, classnames, Button, PrivateMainArea } from 'react-components';
import { History, Location } from 'history';
import { DENSITY } from 'proton-shared/lib/constants';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';

import { Element } from '../models/element';
import { Sort, Filter, Page, SearchParameters } from '../models/tools';

import { useMailboxPageTitle } from '../hooks/useMailboxPageTitle';
import { useElements } from '../hooks/useElements';

import { isColumnMode, isConversationMode } from '../helpers/mailSettings';
import {
    pageFromUrl,
    sortFromUrl,
    filterFromUrl,
    setPageInUrl,
    setSortInUrl,
    setFilterInUrl,
    setPathInUrl,
    extractSearchParameters
} from '../helpers/mailboxUrl';

import Toolbar from '../components/toolbar/Toolbar';
import List from '../components/list/List';
import ConversationView from '../components/conversation/ConversationView';
import PlaceholderView from '../components/view/PlaceholderView';
import MessageOnlyView from '../components/message/MessageOnlyView';
import { OnCompose } from './ComposerContainer';
import { PAGE_SIZE, MESSAGE_ACTIONS } from '../constants';
import { isMessage, isSearch as testIsSearch } from '../helpers/elements';
import { isDraft } from '../helpers/message/messages';
import { Message } from '../models/message';
import { Breakpoints } from '../models/utils';

import './MailboxContainer.scss';
import { getSearchParams } from 'proton-shared/lib/helpers/url';

interface Props {
    labelID: string;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    breakpoints: Breakpoints;
    elementID?: string;
    location: Location;
    history: History;
    onCompose: OnCompose;
}

const MailboxContainer = ({
    labelID: inputLabelID,
    userSettings,
    mailSettings,
    breakpoints,
    elementID: inputElementID,
    location,
    history,
    onCompose
}: Props) => {
    const forceRowMode = breakpoints.isNarrow || breakpoints.isTablet;
    const columnModeSetting = isColumnMode(mailSettings);
    const columnMode = columnModeSetting && !forceRowMode;
    const columnLayout = columnModeSetting || forceRowMode;

    // Page state is hybrid: page number is handled by the url, total computed in useElements, size and limit are constants
    // Yet, it is simpler to co-localize all these data in one object
    const [page, setPage] = useState<Page>({
        page: pageFromUrl(location),
        total: 0,
        size: PAGE_SIZE,
        limit: PAGE_SIZE
    });

    const isCompactView = userSettings.Density === DENSITY.COMPACT;
    const searchParams = getSearchParams(location.search);
    const conversationMode = isConversationMode(inputLabelID, mailSettings, location);
    const searchParameters = useMemo<SearchParameters>(() => extractSearchParameters(location), [
        searchParams.address,
        searchParams.from,
        searchParams.to,
        searchParams.keyword,
        searchParams.begin,
        searchParams.end,
        searchParams.attachments,
        searchParams.wildcard
    ]);
    const isSearch = testIsSearch(searchParameters);
    const sort = useMemo<Sort>(() => sortFromUrl(location), [searchParams.sort]);
    const filter = useMemo<Filter>(() => filterFromUrl(location), [searchParams.filter]);

    const [checkedElements, setCheckedElements] = useState<{ [ID: string]: boolean }>({});

    const [labelID, elements, loading, total] = useElements({
        conversationMode,
        labelID: inputLabelID,
        page,
        sort,
        filter,
        search: searchParameters
    });

    useEffect(() => setPage({ ...page, page: pageFromUrl(location) }), [searchParams.page]);
    useEffect(() => setPage({ ...page, total }), [total]);
    useEffect(() => setCheckedElements({}), [labelID]);

    useMailboxPageTitle(labelID, location);

    const checkedIDs = useMemo(() => {
        return Object.entries(checkedElements).reduce((acc, [elementID, isChecked]) => {
            if (!isChecked) {
                return acc;
            }
            acc.push(elementID);
            return acc;
        }, [] as string[]);
    }, [checkedElements]);

    const elementID = useMemo(() => {
        if (checkedIDs.length > 0) {
            return undefined;
        }
        return inputElementID;
    }, [inputElementID, checkedIDs]);

    const selectedIDs = useMemo(() => {
        if (checkedIDs.length) {
            return checkedIDs;
        }
        if (elementID) {
            return [elementID];
        }
        return [];
    }, [checkedIDs, elementID]);

    const handleElement = (element: Element) => {
        history.push(setPathInUrl(location, labelID, element.ID));
        if (isMessage(element) && isDraft(element)) {
            onCompose({ existingDraft: { localID: element.ID as string, data: element as Message } });
        }
        setCheckedElements({});
    };
    const handleBack = () => history.push(setPathInUrl(location, labelID));
    const handlePage = (pageNumber: number) => history.push(setPageInUrl(location, pageNumber));
    const handleSort = (sort: Sort) => history.push(setSortInUrl(location, sort));
    const handleFilter = (filter: Filter) => history.push(setFilterInUrl(location, filter));

    /**
     * Put *IDs* to *checked* state
     * Uncheck others id *replace* is true
     */
    const handleCheck = (IDs: string[], checked: boolean, replace: boolean) =>
        setCheckedElements(
            elements.reduce((acc, { ID = '' }) => {
                const wasChecked = checkedElements[ID];
                const toCheck = IDs.includes(ID);
                acc[ID] = toCheck ? checked : replace ? !checked : wasChecked;
                return acc;
            }, {} as { [ID: string]: boolean })
        );

    const handleUncheckAll = () => handleCheck([], true, true);

    const handleCompose = () => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    };

    const showToolbar = !breakpoints.isNarrow || !inputElementID;
    const showList = columnMode || !inputElementID;
    const showContentView = (columnMode && (loading || elements.length)) || inputElementID;
    const showPlaceholder = !breakpoints.isNarrow && !elementID;
    const showMobileCompose = breakpoints.isNarrow;

    return (
        <>
            {showMobileCompose && (
                <Button className="pm-button--primary mobile-compose" icon="compose" onClick={handleCompose} />
            )}
            {showToolbar && (
                <Toolbar
                    location={location}
                    labelID={labelID}
                    elementID={elementID}
                    selectedIDs={selectedIDs}
                    elements={elements}
                    mailSettings={mailSettings}
                    columnMode={columnMode}
                    conversationMode={conversationMode}
                    breakpoints={breakpoints}
                    onCheck={handleCheck}
                    page={page}
                    onPage={handlePage}
                    sort={sort}
                    onSort={handleSort}
                    filter={filter}
                    onFilter={handleFilter}
                    onBack={handleBack}
                    onElement={handleElement}
                />
            )}
            <PrivateMainArea className="flex" hasToolbar={showToolbar} hasRowMode={!showContentView}>
                {showList && (
                    <div
                        className={classnames([
                            'items-column-list scroll-if-needed scroll-smooth-touch',
                            isCompactView && 'is-compact'
                        ])}
                    >
                        <div className="items-column-list-inner">
                            {loading ? (
                                <div className="flex flex-justify-center h100">
                                    <Loader />
                                </div>
                            ) : (
                                <List
                                    location={location}
                                    labelID={labelID}
                                    columnLayout={columnLayout}
                                    mailSettings={mailSettings}
                                    elementID={elementID}
                                    elements={elements}
                                    checkedIDs={checkedIDs}
                                    onCheck={handleCheck}
                                    onClick={handleElement}
                                    userSettings={userSettings}
                                    isSearch={isSearch}
                                />
                            )}
                        </div>
                    </div>
                )}
                {showContentView && (
                    <section className="view-column-detail flex flex-column flex-item-fluid no-scroll">
                        {showPlaceholder ? (
                            <PlaceholderView
                                location={location}
                                labelID={labelID}
                                mailSettings={mailSettings}
                                checkedIDs={checkedIDs}
                                onUncheckAll={handleUncheckAll}
                            />
                        ) : conversationMode ? (
                            <ConversationView
                                labelID={labelID}
                                mailSettings={mailSettings}
                                conversationID={inputElementID as string}
                                onBack={handleBack}
                                onCompose={onCompose}
                            />
                        ) : (
                            <MessageOnlyView
                                labelID={labelID}
                                mailSettings={mailSettings}
                                messageID={inputElementID as string}
                                onBack={handleBack}
                                onCompose={onCompose}
                            />
                        )}
                    </section>
                )}
            </PrivateMainArea>
        </>
    );
};

export default MailboxContainer;
