import React, { ComponentPropsWithRef, useContext } from 'react';

import { classnames } from '../../helpers';
import { Icon } from '../icon';
import { Button } from '../button';
import { Vr } from '../vr';
import { ModalContext } from './Modal';
import './ModalHeader.scss';

interface ModalHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
    /**
     * The title to render in the Modal header.
     */
    title?: string;
    /**
     * A subline to render below the Title.
     * Will not render unless "title" is passed as well.
     */
    subline?: string;
    /**
     * Intended for use with icon buttons.
     * Slot for Element(s) to be rendered next to the close button.
     *
     */
    actions?: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element];
}

const ModalHeader = ({ title, subline, actions, ...rest }: ModalHeaderProps) => {
    const { id, onClose, large, full } = useContext(ModalContext);

    const [firstAction, secondAction] = Array.isArray(actions) ? actions : [actions];

    return (
        <div
            className={classnames([
                'modal-two-header flex flex-nowrap flex-item-noshrink flex-align-items-start',
                title ? 'flex-justify-space-between' : 'flex-justify-end',
            ])}
            {...rest}
        >
            {title && (
                <div className="modal-two-header-title mt0-25">
                    <h3 id={id} className={classnames(['text-bold', large || full ? 'text-2xl' : 'text-xl'])}>
                        {title}
                    </h3>
                    {subline && <div className="color-weak">{subline}</div>}
                </div>
            )}

            <div className="modal-two-header-actions flex flex-item-noshrink flex-nowrap flex-align-items-stretch">
                {actions && (
                    <>
                        {firstAction}
                        {secondAction}
                        <Vr className="my0-25" />
                    </>
                )}

                <Button className="flex-item-noshrink" icon shape="ghost" onClick={onClose}>
                    <Icon className="modal-close-icon" name="xmark" />
                </Button>
            </div>
        </div>
    );
};

export default ModalHeader;
